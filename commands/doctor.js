module.exports = {
  command: 'doctor <bundle>',
  desc: 'report on common problems',
  handler
}

function handler({bundle}) {
  const {green, red, yellow, emoji} = require('@buzuli/color')
  const r = require('ramda')

  const health = tracker()

  require('../lib/bundle')(bundle)
  .on('error', error => {
    console.error(error)
    console.error(emoji.inject(red(`Error reading bundle ${yellow(bundle)}. Details above :point_up:`)))
  })
  .on('file', health.checker)
  .once('end', () => {
    const issues = health.issues()
    const ic = issues.length // issue count
    const errors = r.filter(({level}) => level === 'error')(issues)
    const warnings = r.filter(({level}) => level === 'warn')(issues)
    const issueIcon = errors.length > 0 ? ':x:' : ':warning:'
    const issueColor = errors.length > 0 ? red : yellow

    if (ic > 0) {
      warnings.forEach(({message}) => {
        console.info(emoji.inject(`:warning:  ${yellow('WARNING')} : ${message}`))
      })
      errors.forEach(({message}) => {
        console.info(emoji.inject(`:x:  ${red('ERROR')} : ${message}`))
    })
      console.log(issueColor(emoji.inject(`${issueIcon}  There ${ic == 1 ? 'is' : 'are'} ${health.issues().length} health issue${ic == 1 ? '' : 's'} with this cluster. Details above :point_up:`)))
    } else {
      console.log(emoji.inject(':white_check_mark: '), green('Appears healthy.'))
    }
  })
}

function tracker () {
  const issues = []
  const checkFile = fileChecker() 

  return {
    issues: () => issues,
    checker: file => {
      checkFile({issues, ...file})
    }
  }
}

function fileChecker () {
  const r = require('ramda')
  const ReadableStream = require('stream').Readable
  const {blue, gray} = require('@buzuli/color')

  const {
    extractLine
  } = require('../lib/lines')

  return async (context) => { 
    const {next, path, skip, stream, issues} = context

    try {
      let testSuffix = 'deadbeef'
      //const testSuffix = 'sysconfig/replicated'
      
      // XXX:
      // - for testing : ~/Documents/support/HP/2018-02-15

      // TODO:
      // - confirm all expected containers are running
      // - confirm all expected containers have been running for longer than 15 min.
      
      // Health
      //testSuffix = 'docker_inspect.json' // for each container
      //testSuffix = 'daemon/commands/date'
      //testSuffix = 'daemon/commands/df'
      //testSuffix = 'daemon/commands/df_inodes'
      //testSuffix = 'daemon/commands/dmesg' // Cound unique messages
      //testSuffix = 'daemon/commands/free'
      //testSuffix = 'daemon/docker/docker_info.json'
      //testSuffix = 'daemon/docker/docker_ps_a.json'
      //testSuffix = 'daemon/proc/cpuinfo' // powerful enough (4+ cores @ 2+ GHz)
      //testSuffix = 'daemon/proc/meminfo' // at least 16GB (ideally 32+)
      //testSuffix = 'daemon/proc/version' // is kernel version problematic?
      //testSuffix = 'daemon/proc/vmstat'
      //testSuffix = 'daemon/etc/systemd/system/docker.service.d/http-proxy.conf'
      //testSuffix = 'daemon/replicated/hostInfo.json'
      //testSuffix = 'daemon/replicated/params.json' // Replicated configuration
      //testSuffix = 'scheduler/nodes.txt' // npme cluster nodes (docker servers)

      // Informational
      //testSuffix = 'errors.txt'
      //testSuffix = 'license.txt' // Determine if AppVersion is out of date
      //testSuffix = 'daemon/replicated/daemon.json'
      //testSuffix = 'daemon/etc/sysconfig/replicated'
      //testSuffix = 'daemon/etc/sysconfig/replicated-operator'

      // Advanced
      //testSuffix = 'stderr.log'
      //testSuffix = 'daemon/commands/ip_addr_show'
      //testSuffix = 'daemon/commands/ip_link_show'
      //testSuffix = 'daemon/commands/ip_route_show'
      //testSuffix = 'daemon/journald/replicated-operator.log'
      //testSuffix = 'daemon/journald/replicated-ui.log'
      //testSuffix = 'daemon/journald/replicated.log'
      //testSuffix = 'daemon/replicated/replicated-operator.log'
      //testSuffix = 'daemon/replicated/replicated-ui.log'
      //testSuffix = 'daemon/replicated/replicated.log'
      //testSuffix = 'daemon/replicated/config-commands.txt'
      //testSuffix = 'daemon/replicated/ledis-app.dump'
      //testSuffix = 'daemon/replicated/ledis-registry.dump'
      //testSuffix = 'daemon/replicated/replicated-inspect.json'
      //testSuffix = 'daemon/replicated/replicated-operator-inspect.json'
      //testSuffix = 'daemon/replicated/replicated-ui-inspect.json'
      //testSuffix = 'daemon/replicated/replicated-versions.txt'
      //testSuffix = 'daemon/replicated/runtime/goroutines.txt'
      //testSuffix = 'daemon/replicated/tasks.txt'

      if (r.endsWith('license.txt')(path)) {
        await licenseCheck(context)
        next()
      } else if (r.endsWith(testSuffix)(path)) {
        console.log(blue(path))
        stream().on('end', next)
        stream().pipe(process.stdout)
        //stream().resume()
      } else {
        //console.log(gray(path))
        skip()
      }
    } catch (error) {
      next(error)
    }
  }

  async function licenseCheck ({issues, stream}) {
    const latestVersion = 447
    const line = await extractLine(line => r.startsWith('AppVersion:')(line))(stream())
    const [match, hash, version] = line.match(/:\s*(\w+)\s*\((\d+)\)$/) || []

    if (!match) {
      issues.push({
        level: 'error',
        message: 'Version information not found.'
      })
    } else if (Number(version) < latestVersion) {
      issues.push({
        level: 'warn',
        message: `Installed version (${version}) is behind the latest (${latestVersion})`
      })
    }
  }
}

/* What files should the doctor inspect?
 *
 * errors.txt ?
 * license.txt ?
 *
 * daemon/commands/date +
 * daemon/commands/df +
 * daemon/commands/df_inodes -
 * daemon/commands/dmesg ?
 * daemon/commands/free +
 * daemon/commands/hostname -
 * daemon/commands/ip_addr_show -
 * daemon/commands/ip_link_show -
 * daemon/commands/ip_route_show -
 * daemon/commands/ps ?
 * daemon/commands/uptime ?
 *
 * daemon/docker/docker_info.json +
 * daemon/docker/docker_ps_a.json +
 *
 * daemon/etc/centos-release -
 * daemon/etc/hostname -
 * daemon/etc/hosts -
 * daemon/etc/os-release -
 * daemon/etc/sysconfig/replicated ?
 * daemon/etc/sysconfig/replicated-operator ?
 * daemon/etc/system-release ?
 * daemon/etc/systemd/system/docker.service.d/http-proxy.conf ?
 *
 * daemon/journald/replicated-operator.log ?
 * daemon/journald/replicated-ui.log ?
 * daemon/journald/replicated.log ?
 *
 * daemon/proc/cpuinfo ?
 * daemon/proc/meminfo ?
 * daemon/proc/mounts ?
 * daemon/proc/uptime ?
 * daemon/proc/version ?
 * daemon/proc/vmstat ?
 *
 * daemon/replicated/config-commands.txt ?
 * daemon/replicated/daemon.json ?
 * daemon/replicated/daemon.json ?
 * daemon/replicated/hostInfo.json ?
 * daemon/replicated/ledis-app.dump ?
 * daemon/replicated/ledis-registry.dump ?
 * daemon/replicated/params.json ?
 * daemon/replicated/replicated-inspect.json ?
 * daemon/replicated/replicated-operator-inspect.json ?
 * daemon/replicated/replicated-operator.log ?
 * daemon/replicated/replicated-ui-inspect.json ?
 * daemon/replicated/replicated-ui.log ?
 * daemon/replicated/replicated-versions.txt ?
 * daemon/replicated/replicated.log ?
 * daemon/replicated/runtime/goroutines.txt ?
 * daemon/replicated/tasks.txt ?
 *
 * scheduler/nodes.txt ?
 *
 * scheduler/container/.../docker_inspect.json ?
 * scheduler/container/.../*.log ?
 */
